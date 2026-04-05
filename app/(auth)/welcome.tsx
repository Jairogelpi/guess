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
  const titleSize = compactHero ? 36 : 44
  const highlightSize = compactHero ? 56 : 68
  const subtitleSize = compactHero ? 14 : 16
  const guestFontSize = compactHero ? 14 : 15
  const guestButtonHeight = compactHero ? 32 : WELCOME_HERO_CTA_HEIGHT
  const secondaryButtonHeight = compactHero ? 28 : WELCOME_HERO_SECONDARY_CTA_HEIGHT
  const secondaryFontSize = compactHero ? 9 : 10
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
        <View style={styles.headerAbsolute}>
          <AppHeader />
        </View>

        <View style={styles.container}>
          <InteractiveCardTilt profileName="hero" regionKey="welcome-hero" testID="welcome-hero-tilt" showPolish={false}>
            <View style={[styles.mainCard, { width: cardWidth, height: cardHeight }]}>
              <Animated.View style={[styles.cardImageLayer, animatedStyle]}>
                <Image
                  source={require('../../assets/carta.png')}
                  style={styles.cardImage}
                  resizeMode="cover"
                  blurRadius={WELCOME_HERO_IMAGE_BLUR_RADIUS}
                />
              </Animated.View>

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
                    <View style={styles.actionGroup}>
                      <Pressable
                        accessibilityRole="button"
                        testID="welcome-enter-guest-button"
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
                        <LinearGradient colors={['#FF8C00', '#E65100']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.guestBtnGradient}>
                          {loading ? (
                            <ActivityIndicator size="small" color="#fff7ea" />
                          ) : (
                            <Text style={[styles.guestBtnText, { fontSize: guestFontSize, lineHeight: guestFontSize + 2 }]}>
                              {t('welcome.enterAsGuest').toUpperCase()}
                            </Text>
                          )}
                        </LinearGradient>
                      </Pressable>
                      <Text style={styles.hintText}>{t('welcome.guestHint')}</Text>
                    </View>

                    <View style={styles.actionGroup}>
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
                      <Text style={[styles.accountHintText, { marginTop: compactHero ? 2 : 4 }]}>{t('welcome.accountHint')}</Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </InteractiveCardTilt>
        </View>

        <View style={styles.footerAbsolute}>
          <SafeAreaView edges={['bottom']} style={styles.footerContainer}>
            <Text style={styles.footerText}>{`GUESS THE PROMPT ${footerYear}`}</Text>
          </SafeAreaView>
        </View>
      </View>
    </Background>
  )
}

const styles = StyleSheet.create({
  overlayRoot: { flex: 1, backgroundColor: 'transparent' },
  headerAbsolute: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  footerAbsolute: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  mainCard: {
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: WELCOME_HERO_CARD_BACKGROUND,
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    borderRadius: 30,
    transform: [{ scale: WELCOME_HERO_IMAGE_SCALE }],
  },
  cardImageLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingHorizontal: 16,
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
    textShadowColor: 'rgba(5, 1, 0, 0.42)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 0,
    letterSpacing: 1.1,
    width: '100%',
  },
  brandTitleHighlight: {
    fontSize: 52,
    marginTop: -8,
    color: '#fffaf2',
    textShadowColor: 'rgba(4, 1, 0, 0.46)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 0,
  },
  promptTitleFill: {
    color: '#fffaf2',
    textShadowColor: 'rgba(4, 1, 0, 0.46)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 0,
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
    textShadowColor: 'rgba(4, 1, 0, 0.32)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
    width: '92%',
  },
  cardFooter: {
    alignItems: 'center',
    width: '100%',
    gap: 16,
    marginTop: 4,
  },
  actionGroup: {
    width: '100%',
    alignItems: 'center',
    gap: 6,
  },
  guestBtn: {
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FFA726',
    overflow: 'hidden',
  },
  guestBtnGradient: {
    flex: 1,
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
    textShadowColor: 'rgba(3, 1, 0, 0.38)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
  disabledBtn: {
    opacity: 0.55,
  },
  hintText: {
    color: 'rgba(255, 241, 222, 0.96)',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 12,
    textShadowColor: 'rgba(4, 1, 0, 0.28)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
  secondaryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '88%',
    paddingHorizontal: 8,
  },
  smallActionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 210, 100, 0.55)',
    backgroundColor: 'rgba(255, 180, 50, 0.12)',
  },
  registerBtn: {
    backgroundColor: 'rgba(220, 140, 20, 0.82)',
    borderColor: 'rgba(255, 220, 110, 0.90)',
  },
  secondaryBtnText: {
    fontFamily: 'CinzelDecorative_700Bold',
    color: 'rgba(255, 230, 160, 1.0)',
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: 0.4,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    width: '100%',
    textShadowColor: 'rgba(3, 1, 0, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  registerBtnText: {
    fontFamily: 'CinzelDecorative_700Bold',
    color: '#ffffff',
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: 0.4,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    width: '100%',
    textShadowColor: 'rgba(3, 1, 0, 0.50)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  accountHintText: {
    color: 'rgba(255, 241, 222, 0.65)',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(4, 1, 0, 0.22)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
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
