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
import { fonts } from '@/constants/theme'
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
  const [headerHeight, setHeaderHeight] = useState(0)
  const [footerHeight, setFooterHeight] = useState(0)
  const { width: screenWidth, height: screenHeight } = useWindowDimensions()

  const headerTopOffset = 0
  const heroVerticalGap = screenWidth < 390 ? 6 : 16
  const availableHeroHeight = Math.max(
    screenHeight - (headerTopOffset + headerHeight) - footerHeight - heroVerticalGap * 2,
    280,
  )
  const cardWidth = Math.min(
    screenWidth * WELCOME_HERO_CARD_WIDTH_FACTOR,
    WELCOME_HERO_CARD_MAX_WIDTH,
    screenWidth - 12,
    availableHeroHeight / WELCOME_HERO_CARD_RATIO,
  )
  const cardHeight = cardWidth * WELCOME_HERO_CARD_RATIO
  const heroLayoutScale = Math.max(0.88, Math.min(cardWidth / 390, 1.02))
  const heroTextScale = Math.max(0.98, Math.min(cardWidth / 390, 1.06))
  const scaleHeroLayoutValue = (value: number, min: number) => Math.max(min, Math.round(value * heroLayoutScale))
  const scaleHeroTextValue = (value: number, min: number) => Math.max(min, Math.round(value * heroTextScale))
  const compactHero = screenWidth < 390
  const cardRadius = scaleHeroLayoutValue(28, 22)
  const imageRadius = scaleHeroLayoutValue(30, 24)
  const overlayHorizontalPadding = scaleHeroLayoutValue(24, 16)
  const overlayTopPadding = scaleHeroLayoutValue(12, 8)
  const overlayBottomPadding = scaleHeroLayoutValue(28, 18)
  const cardStackGap = scaleHeroLayoutValue(WELCOME_HERO_STACK_GAP, 10)
  const cardContentGap = scaleHeroLayoutValue(16, 12)
  const titleGroupGap = scaleHeroLayoutValue(16, 12)
  const titleHorizontalPadding = scaleHeroLayoutValue(18, 12)
  const titleSize = scaleHeroTextValue(compactHero ? 42 : 50, 38)
  const highlightSize = scaleHeroTextValue(compactHero ? 66 : 78, 62)
  const subtitleSize = scaleHeroTextValue(compactHero ? 15 : 17, 15)
  const subtitleLineHeight = subtitleSize + scaleHeroLayoutValue(7, 4)
  const brandLetterSpacing = Math.max(0.9, Number((1.05 * heroTextScale).toFixed(2)))
  const promptMarginTop = -scaleHeroLayoutValue(4, 3)
  const dividerWidth = scaleHeroLayoutValue(82, 58)
  const dividerHeight = Math.max(1, Math.round(2 * heroLayoutScale))
  const dividerMarginVertical = scaleHeroLayoutValue(10, 7)
  const guestFontSize = scaleHeroTextValue(compactHero ? 16 : 17, 15)
  const guestLineHeight = guestFontSize + scaleHeroLayoutValue(4, 3)
  const guestButtonHeight = scaleHeroLayoutValue(compactHero ? 44 : 48, 42)
  const guestButtonRadius = scaleHeroLayoutValue(24, 20)
  const guestButtonBorderWidth = Math.max(1, Number((2 * heroLayoutScale).toFixed(2)))
  const guestButtonPaddingHorizontal = scaleHeroLayoutValue(24, 18)
  const hintFontSize = scaleHeroTextValue(14, 13)
  const hintLineHeight = hintFontSize + scaleHeroLayoutValue(6, 4)
  const hintPaddingHorizontal = scaleHeroLayoutValue(14, 10)
  const footerGap = scaleHeroLayoutValue(WELCOME_HERO_FOOTER_GAP, 10)
  const footerMarginTop = scaleHeroLayoutValue(8, 4)
  const actionGroupGap = scaleHeroLayoutValue(10, 8)
  const secondaryButtonHeight = scaleHeroLayoutValue(compactHero ? 38 : 40, 36)
  const secondaryFontSize = scaleHeroTextValue(compactHero ? 12 : 13, 11)
  const secondaryLineHeight = secondaryFontSize + scaleHeroLayoutValue(4, 3)
  const secondaryGap = scaleHeroLayoutValue(compactHero ? 10 : WELCOME_HERO_SECONDARY_ACTION_GAP, 8)
  const secondaryActionsPaddingHorizontal = scaleHeroLayoutValue(10, 6)
  const secondaryButtonPaddingHorizontal = scaleHeroLayoutValue(14, 10)
  const secondaryButtonRadius = scaleHeroLayoutValue(18, 14)
  const secondaryButtonBorderWidth = Math.max(1, Number((1.5 * heroLayoutScale).toFixed(2)))
  const secondaryHintMarginTop = scaleHeroLayoutValue(compactHero ? 4 : WELCOME_HERO_SECONDARY_HINT_MARGIN_TOP, 2)
  const accountHintFontSize = scaleHeroTextValue(12, 11)
  const accountHintLineHeight = accountHintFontSize + scaleHeroLayoutValue(6, 4)
  const accountHintPaddingHorizontal = scaleHeroLayoutValue(18, 12)
  const footerFontSize = scaleHeroTextValue(14, 13)
  const footerLetterSpacing = Math.max(1.8, 2.4 * heroTextScale)
  const footerBottomPadding = scaleHeroLayoutValue(25, 16)
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
        <View
          style={styles.headerAbsolute}
          onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
        >
          <AppHeader />
        </View>

        <View
          style={[
            styles.container,
            {
              paddingTop: headerHeight + headerTopOffset + heroVerticalGap,
              paddingBottom: footerHeight + heroVerticalGap,
            },
          ]}
        >
          <InteractiveCardTilt
            profileName="hero"
            regionKey="welcome-hero"
            testID="welcome-hero-tilt"
            showPolish={false}
            style={{ width: cardWidth, height: cardHeight }}
          >
            <View style={[styles.mainCard, { borderRadius: cardRadius }]}>
              <Animated.View style={[styles.cardImageLayer, animatedStyle]}>
                <Image
                  source={require('../../assets/carta.png')}
                  style={[styles.cardImage, { borderRadius: imageRadius }]}
                  resizeMode="cover"
                  blurRadius={WELCOME_HERO_IMAGE_BLUR_RADIUS}
                />
              </Animated.View>

              <LinearGradient
                colors={WELCOME_HERO_OVERLAY_COLORS}
                style={[
                  styles.cardOverlay,
                  {
                    paddingHorizontal: overlayHorizontalPadding,
                    paddingTop: overlayTopPadding,
                    paddingBottom: overlayBottomPadding,
                  },
                ]}
              >
                <View style={[styles.cardColumn, { gap: cardStackGap }]}>
                  <View style={[styles.cardContent, { gap: cardContentGap }]}>
                    <View style={[styles.titleGroup, { paddingHorizontal: titleHorizontalPadding, gap: titleGroupGap }]}>
                          {WELCOME_HERO_SHOW_LOGO && (
                            <Image
                              source={require('../../assets/logo.png')}
                              style={[styles.heroLogo, { width: scaleHeroLayoutValue(60, 44), height: scaleHeroLayoutValue(60, 44), borderRadius: scaleHeroLayoutValue(12, 8), marginBottom: scaleHeroLayoutValue(4, 2) }]}
                              resizeMode="contain"
                            />
                          )}
                          <Text
                            style={[styles.brandTitle, { fontSize: titleSize, letterSpacing: brandLetterSpacing }]}
                            numberOfLines={1}
                          >
                            GUESS THE
                      </Text>
                      <Text
                        style={[
                          styles.brandTitle,
                          styles.brandTitleHighlight,
                          styles.promptTitleFill,
                          {
                            fontSize: highlightSize,
                            marginTop: promptMarginTop,
                            letterSpacing: Math.max(0.7, 0.9 * heroTextScale),
                          },
                        ]}
                        numberOfLines={1}
                      >
                        PROMPT
                      </Text>
                    </View>

                    <View style={[styles.divider, { width: dividerWidth, height: dividerHeight, marginVertical: dividerMarginVertical }]} />
                    <Text
                      style={[styles.subtitle, { fontSize: subtitleSize, lineHeight: subtitleLineHeight }]}
                      numberOfLines={2}
                    >
                      {t('welcome.subtitle')}
                    </Text>
                  </View>

                  <View style={[styles.cardFooter, { gap: footerGap, marginTop: footerMarginTop }]}>
                    <View style={[styles.actionGroup, { gap: actionGroupGap }]}>
                      <Pressable
                        accessibilityRole="button"
                        testID="welcome-enter-guest-button"
                        onPress={enterAsGuest}
                        disabled={loading}
                        style={[
                          styles.guestBtn,
                          {
                            height: guestButtonHeight,
                            width: compactHero ? '90%' : `${WELCOME_HERO_CTA_WIDTH_FACTOR * 100}%`,
                            borderRadius: guestButtonRadius,
                            borderWidth: guestButtonBorderWidth,
                          },
                          loading && styles.disabledBtn,
                        ]}
                      >
                        <LinearGradient
                          colors={['#FF8C00', '#E65100']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={[styles.guestBtnGradient, { paddingHorizontal: guestButtonPaddingHorizontal }]}
                        >
                          {loading ? (
                            <ActivityIndicator size="small" color="#fff7ea" />
                          ) : (
                            <Text style={[styles.guestBtnText, { fontSize: guestFontSize, lineHeight: guestLineHeight, letterSpacing: Math.max(1.1, 1.6 * heroTextScale) }]}>
                              {t('welcome.enterAsGuest').toUpperCase()}
                            </Text>
                          )}
                        </LinearGradient>
                      </Pressable>
                      <Text
                        style={[
                          styles.hintText,
                          {
                            fontSize: hintFontSize,
                            lineHeight: hintLineHeight,
                            paddingHorizontal: hintPaddingHorizontal,
                          },
                        ]}
                      >
                        {t('welcome.guestHint')}
                      </Text>
                    </View>

                    <View style={[styles.actionGroup, { gap: actionGroupGap }]}>
                      <View style={[styles.secondaryActions, { gap: secondaryGap, paddingHorizontal: secondaryActionsPaddingHorizontal }]}>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => router.push({ pathname: '/(auth)/login', params: { mode: 'signin' } })}
                          style={[
                            styles.smallActionBtn,
                            {
                              height: secondaryButtonHeight,
                              paddingHorizontal: secondaryButtonPaddingHorizontal,
                              borderRadius: secondaryButtonRadius,
                              borderWidth: secondaryButtonBorderWidth,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.secondaryBtnText,
                              {
                                fontSize: secondaryFontSize,
                                lineHeight: secondaryLineHeight,
                                letterSpacing: Math.max(0.3, 0.4 * heroTextScale),
                              },
                            ]}
                          >
                            {t('welcome.signIn')}
                          </Text>
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => router.push({ pathname: '/(auth)/login', params: { mode: 'register' } })}
                          style={[
                            styles.smallActionBtn,
                            styles.registerBtn,
                            {
                              height: secondaryButtonHeight,
                              paddingHorizontal: secondaryButtonPaddingHorizontal,
                              borderRadius: secondaryButtonRadius,
                              borderWidth: secondaryButtonBorderWidth,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.registerBtnText,
                              {
                                fontSize: secondaryFontSize,
                                lineHeight: secondaryLineHeight,
                                letterSpacing: Math.max(0.3, 0.4 * heroTextScale),
                              },
                            ]}
                          >
                            {t('profile.upgradeAccount')}
                          </Text>
                        </Pressable>
                      </View>
                      <Text
                        style={[
                          styles.accountHintText,
                          {
                            marginTop: secondaryHintMarginTop,
                            fontSize: accountHintFontSize,
                            lineHeight: accountHintLineHeight,
                            paddingHorizontal: accountHintPaddingHorizontal,
                          },
                        ]}
                      >
                        {t('welcome.accountHint')}
                      </Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </InteractiveCardTilt>
        </View>

        <View
          style={styles.footerAbsolute}
          onLayout={(event) => setFooterHeight(event.nativeEvent.layout.height)}
        >
          <SafeAreaView edges={['bottom']} style={[styles.footerContainer, { paddingBottom: footerBottomPadding }]}>
            <Text style={[styles.footerText, { fontSize: footerFontSize, letterSpacing: footerLetterSpacing }]}>{`GUESS THE PROMPT ${footerYear}`}</Text>
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
    top: 0,
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
    flex: 1,
    width: '100%',
    height: '100%',
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
    alignItems: 'center',
    justifyContent: WELCOME_HERO_OVERLAY_JUSTIFY_CONTENT,
  },
  cardColumn: {
    width: '100%',
    alignItems: 'center',
  },
  cardContent: {
    alignItems: 'center',
    width: '100%',
  },
  titleGroup: {
    alignItems: 'center',
    width: '100%',
  },
  heroLogo: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginBottom: 4,
  },
  brandTitle: {
    fontFamily: fonts.titleHeavy,
    color: '#fff7ea',
    fontSize: 40,
    textAlign: 'center',
    textShadowColor: 'rgba(5, 1, 0, 0.42)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 0,
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
  },
  subtitle: {
    fontFamily: fonts.title,
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
  },
  actionGroup: {
    width: '100%',
    alignItems: 'center',
  },
  guestBtn: {
    borderColor: '#FFA726',
    overflow: 'hidden',
  },
  guestBtnGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestBtnText: {
    fontFamily: fonts.title,
    color: '#fffaf1',
    fontSize: WELCOME_GUEST_CTA_FONT_SIZE,
    lineHeight: WELCOME_GUEST_CTA_FONT_SIZE + 2,
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
    fontFamily: fonts.title,
    color: 'rgba(255, 241, 222, 0.96)',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    textShadowColor: 'rgba(4, 1, 0, 0.28)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
  secondaryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '92%',
  },
  smallActionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderColor: 'rgba(255, 210, 100, 0.55)',
    backgroundColor: 'rgba(255, 180, 50, 0.12)',
  },
  registerBtn: {
    backgroundColor: 'rgba(220, 140, 20, 0.82)',
    borderColor: 'rgba(255, 220, 110, 0.90)',
  },
  secondaryBtnText: {
    fontFamily: fonts.title,
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
    fontFamily: fonts.title,
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
    fontFamily: fonts.title,
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
    fontFamily: fonts.title,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    letterSpacing: 3,
  },
})
