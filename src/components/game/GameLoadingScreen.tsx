import { useEffect, useRef } from 'react'
import { Animated, Easing, View, Text, Image, StyleSheet, Dimensions } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors, fonts } from '@/constants/theme'

const { width: W, height: H } = Dimensions.get('window')
const CARD_W = Math.min(W * 0.36, 148)
const CARD_H = CARD_W * 1.5

// ─────────────────────────────────────────────────────────────────────────────
// Expanding ring that pulses outward and fades
// ─────────────────────────────────────────────────────────────────────────────
function PulseRing({ delay, size }: { delay: number; size: number }) {
  const scale = useRef(new Animated.Value(0.4)).current
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1.9,
            duration: 2200,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, { toValue: 0.38, duration: 180, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 2020, useNativeDriver: true }),
          ]),
        ]),
        // Reset instantly
        Animated.parallel([
          Animated.timing(scale, { toValue: 0.4, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
        Animated.delay(200),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [scale, opacity, delay])

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1.5,
        borderColor: colors.gold,
        opacity,
        transform: [{ scale }],
      }}
    />
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Gold dust particle — drifts upward and fades
// ─────────────────────────────────────────────────────────────────────────────
function Particle({ x, y, delay, size }: { x: number; y: number; delay: number; size: number }) {
  const ty = useRef(new Animated.Value(0)).current
  const op = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(ty, {
            toValue: -80,
            duration: 2600,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(op, { toValue: 0.75, duration: 450, useNativeDriver: true }),
            Animated.timing(op, { toValue: 0, duration: 1400, useNativeDriver: true }),
          ]),
        ]),
        Animated.timing(ty, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(400),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [ty, op, delay])

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.gold,
        opacity: op,
        transform: [{ translateY: ty }],
      }}
    />
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Shimmer streak that sweeps across the card face
// ─────────────────────────────────────────────────────────────────────────────
function CardShimmer() {
  const tx = useRef(new Animated.Value(-CARD_W)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(1400),
        Animated.timing(tx, {
          toValue: CARD_W * 1.6,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(tx, { toValue: -CARD_W, duration: 0, useNativeDriver: true }),
        Animated.delay(200),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [tx])

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: -8,
        bottom: -8,
        left: 0,
        width: CARD_W * 0.20,
        transform: [{ translateX: tx }, { skewX: '-18deg' }],
        backgroundColor: 'rgba(255, 241, 222, 0.11)',
      }}
    />
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Individual bouncing wave dot
// ─────────────────────────────────────────────────────────────────────────────
function WaveDot({ delay }: { delay: number }) {
  const ty = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(ty, { toValue: -9, duration: 340, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1.3, duration: 340, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(ty, { toValue: 0, duration: 340, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 340, useNativeDriver: true }),
        ]),
        Animated.delay(Math.max(0, 960 - delay)),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [ty, scale, delay])

  return (
    <Animated.View style={[styles.waveDot, { transform: [{ translateY: ty }, { scale }] }]} />
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main loading screen
// ─────────────────────────────────────────────────────────────────────────────
const PARTICLES = [
  { x: W * 0.14, y: H * 0.46, delay: 0,    size: 3 },
  { x: W * 0.25, y: H * 0.55, delay: 500,  size: 2 },
  { x: W * 0.70, y: H * 0.48, delay: 900,  size: 4 },
  { x: W * 0.83, y: H * 0.42, delay: 250,  size: 2 },
  { x: W * 0.40, y: H * 0.63, delay: 700,  size: 3 },
  { x: W * 0.62, y: H * 0.57, delay: 1150, size: 2 },
  { x: W * 0.20, y: H * 0.37, delay: 800,  size: 2 },
  { x: W * 0.78, y: H * 0.61, delay: 1350, size: 3 },
]

export function GameLoadingScreen() {
  const { t } = useTranslation()

  const cardScale   = useRef(new Animated.Value(0.82)).current
  const cardOpacity = useRef(new Animated.Value(0)).current
  const cardRotate  = useRef(new Animated.Value(0)).current
  const titleOpacity = useRef(new Animated.Value(0)).current
  const titleY      = useRef(new Animated.Value(12)).current
  const dotsOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Card springs in
    Animated.parallel([
      Animated.spring(cardScale, { toValue: 1, damping: 13, stiffness: 90, useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 1, duration: 480, useNativeDriver: true }),
    ]).start()

    // Title follows 300ms later
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.spring(titleY, { toValue: 0, damping: 14, stiffness: 110, useNativeDriver: true }),
      ]),
    ]).start()

    // Dots after title
    Animated.sequence([
      Animated.delay(600),
      Animated.timing(dotsOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start()

    // Continuous slow tilt — card breathes
    const tilt = Animated.loop(
      Animated.sequence([
        Animated.timing(cardRotate, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(cardRotate, {
          toValue: -1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    )
    tilt.start()
    return () => tilt.stop()
  }, [cardScale, cardOpacity, cardRotate, titleOpacity, titleY, dotsOpacity])

  const rotateInterp = cardRotate.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-3deg', '3deg'],
  })

  return (
    <View style={styles.root}>
      {/* ── Atmospheric glow behind card ── */}
      <View style={styles.ambientGlow} pointerEvents="none" />
      <View style={styles.ambientGlow2} pointerEvents="none" />

      {/* ── Expanding pulse rings ── */}
      <PulseRing delay={0}    size={CARD_W * 1.9} />
      <PulseRing delay={750}  size={CARD_W * 2.6} />
      <PulseRing delay={1500} size={CARD_W * 3.3} />

      {/* ── Gold dust particles ── */}
      {PARTICLES.map((p, i) => (
        <Particle key={i} x={p.x} y={p.y} delay={p.delay} size={p.size} />
      ))}

      {/* ── Central card ── */}
      <Animated.View
        style={{
          opacity: cardOpacity,
          transform: [{ scale: cardScale }, { rotate: rotateInterp }],
          zIndex: 2,
        }}
      >
        <View style={styles.cardShadow}>
          <View style={styles.cardFrame}>
            <Image
              source={require('../../../assets/carta.png')}
              style={styles.cardImage}
              resizeMode="cover"
            />
            <CardShimmer />
          </View>
        </View>
      </Animated.View>

      {/* ── Text block ── */}
      <Animated.View
        style={[
          styles.textBlock,
          { opacity: titleOpacity, transform: [{ translateY: titleY }] },
        ]}
      >
        <Text style={styles.title}>{t('game.loading')}</Text>
        <Text style={styles.sub}>{t('game.loadingSub')}</Text>
      </Animated.View>

      {/* ── Wave dots ── */}
      <Animated.View style={[styles.dotsRow, { opacity: dotsOpacity }]}>
        {[0, 1, 2, 3].map((i) => (
          <WaveDot key={i} delay={i * 130} />
        ))}
      </Animated.View>

      {/* ── Bottom corner decoration ── */}
      <View style={styles.cornerTL} pointerEvents="none" />
      <View style={styles.cornerBR} pointerEvents="none" />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0602',
    gap: 28,
    overflow: 'hidden',
  },

  // Atmospheric radial glows
  ambientGlow: {
    position: 'absolute',
    width: W * 1.2,
    height: W * 1.2,
    borderRadius: W * 0.6,
    backgroundColor: 'transparent',
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 120,
    elevation: 0,
  },
  ambientGlow2: {
    position: 'absolute',
    width: W * 0.5,
    height: W * 0.5,
    borderRadius: W * 0.25,
    backgroundColor: 'rgba(230, 184, 0, 0.04)',
  },

  // Card with deep shadow
  cardShadow: {
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.30,
    shadowRadius: 32,
    elevation: 20,
  },
  cardFrame: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.gold,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },

  textBlock: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: colors.gold,
    fontSize: 15,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  sub: {
    color: 'rgba(255, 241, 222, 0.38)',
    fontSize: 12,
    fontFamily: fonts.title,
    letterSpacing: 1,
    textAlign: 'center',
  },

  // Wave dots
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    height: 22,
  },
  waveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.gold,
    opacity: 0.75,
  },

  // Corner filigree accents
  cornerTL: {
    position: 'absolute',
    top: 40,
    left: 28,
    width: 36,
    height: 36,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderColor: 'rgba(230, 184, 0, 0.22)',
    borderRadius: 4,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 50,
    right: 28,
    width: 36,
    height: 36,
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: 'rgba(230, 184, 0, 0.22)',
    borderRadius: 4,
  },
})
