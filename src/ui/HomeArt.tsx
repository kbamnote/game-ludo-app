import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { useFocusEffect } from 'expo-router'
import { AccessibilityInfo, Animated, Easing, Platform, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import { A } from '../theme'
import { DISPLAY } from './arcade'

const emblems = {
  globe: require('../../assets/home-art/globe.png'),
  friends: require('../../assets/home-art/friends.png'),
  computer: require('../../assets/home-art/computer.png'),
  passPlay: require('../../assets/home-art/pass-play.png'),
  die: require('../../assets/home-art/die.png'),
  trophy: require('../../assets/home-art/trophy.png'),
  spin: require('../../assets/home-art/spin.png'),
  crown: require('../../assets/home-art/crown.png'),
} as const

const MotionClock = createContext<{
  emblems: Animated.Value
  board: Animated.Value
  pulse?: {
    scale: Animated.AnimatedInterpolation<number>
    opacity: Animated.AnimatedInterpolation<number>
    glow: Animated.AnimatedInterpolation<number>
    spin: Animated.AnimatedInterpolation<string>
  }
} | null>(null)

export function HomeArtMotion({ children, style, pulseEmblems = false }: {
  children: ReactNode
  style: StyleProp<ViewStyle>
  pulseEmblems?: boolean
}) {
  const [clocks] = useState(() => ({ emblems: new Animated.Value(0), board: new Animated.Value(0) }))
  const motion = useMemo(() => {
    if (!pulseEmblems) return clocks
    const inputRange = [0, .12, .26, .5, .85, 1]
    return {
      ...clocks,
      pulse: {
        scale: clocks.emblems.interpolate({ inputRange, outputRange: [1, 1, 1.18, 1.05, 1, 1] }),
        opacity: clocks.emblems.interpolate({ inputRange, outputRange: [1, .76, 1, 1, 1, 1] }),
        glow: clocks.emblems.interpolate({ inputRange, outputRange: [0, 0, .85, .3, 0, 0] }),
        spin: clocks.emblems.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }),
      },
    }
  }, [clocks, pulseEmblems])

  useFocusEffect(useCallback(() => {
    let focused = true
    let motionPreferenceChanged = false
    const makeLoop = (clock: Animated.Value, duration: number) => Animated.loop(Animated.timing(clock, {
      toValue: 1,
      duration,
      easing: Easing.linear,
      useNativeDriver: Platform.OS !== 'web',
      isInteraction: false,
    }))
    const loops = [makeLoop(clocks.emblems, pulseEmblems ? 2800 : 4600), makeLoop(clocks.board, 14000)]
    const update = (reduceMotion: boolean) => {
      if (!focused) return
      for (const loop of loops) {
        loop.stop()
        loop.reset()
        if (!reduceMotion) loop.start()
      }
    }
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', reduceMotion => {
      motionPreferenceChanged = true
      update(reduceMotion)
    })
    void AccessibilityInfo.isReduceMotionEnabled().then(reduceMotion => {
      if (!motionPreferenceChanged) update(reduceMotion)
    }).catch(() => {})
    return () => {
      focused = false
      subscription.remove()
      for (const loop of loops) {
        loop.stop()
        loop.reset()
      }
    }
  }, [clocks, pulseEmblems]))

  return <MotionClock.Provider value={motion}><View style={style}>{children}</View></MotionClock.Provider>
}

function useEmblemMotion(group: number) {
  const motion = useContext(MotionClock)
  const clock = motion?.pulse ? undefined : motion?.emblems
  return useMemo(() => {
    if (!clock) return undefined
    const start = .04 + group * .23
    const inputRange = [0, start, start + .12, start + .27, 1]
    return { transform: [
      { scale: clock.interpolate({ inputRange, outputRange: [1, 1, 1.07, 1, 1], extrapolate: 'clamp' }) },
      { rotate: clock.interpolate({ inputRange, outputRange: ['0deg', '0deg', group === 1 ? '4deg' : '-4deg', '0deg', '0deg'], extrapolate: 'clamp' }) },
    ] }
  }, [clock, group])
}

export function HomeEmblem({ name, size }: { name: keyof typeof emblems; size: number }) {
  const stagger = useEmblemMotion(2)
  const pulse = useContext(MotionClock)?.pulse
  const dimensions = { width: size, height: size }
  if (!pulse) return <Animated.Image accessible={false} source={emblems[name]} resizeMode="contain" fadeDuration={0} style={[dimensions, stagger]} />
  if (name === 'globe') return <Animated.Image accessible={false} source={emblems.globe} resizeMode="contain" fadeDuration={0}
    style={[dimensions, { transform: [{ rotate: pulse.spin }] }]} />
  return (
    <Animated.View pointerEvents="none" style={[dimensions, styles.emblem, { transform: [{ scale: pulse.scale }] }]}>
      <Animated.View style={[styles.emblemGlow, { width: size, height: size, borderRadius: size / 2, opacity: pulse.glow }]} />
      <Animated.Image accessible={false} source={emblems[name]} resizeMode="contain" fadeDuration={0}
        style={[dimensions, { opacity: pulse.opacity }]} />
    </Animated.View>
  )
}

export function ArtAccent({ children, group }: { children: ReactNode; group: 0 | 1 | 2 }) {
  const motion = useEmblemMotion(group)
  return <Animated.View style={motion}>{children}</Animated.View>
}

export function LoadingShine({ width }: { width: number }) {
  const clock = useContext(MotionClock)?.emblems
  const shineX = useMemo(() => clock?.interpolate({
    inputRange: [0, .64, 1],
    outputRange: [-38, width + 38, width + 38],
    extrapolate: 'clamp',
  }), [clock, width])
  return shineX && <Animated.View pointerEvents="none" style={[styles.shine, { transform: [{ translateX: shineX }, { skewX: '-20deg' }] }]} />
}

export function HomeBrand({ size }: { size: number }) {
  const clock = useContext(MotionClock)?.board
  const wordmarkSize = Math.round(Math.min(50, size * .22))
  const rotation = useMemo(() => clock?.interpolate({
    inputRange: [0, .125, .25, .375, .5, .625, .75, .875, 1],
    outputRange: ['0deg', '4.2deg', '6deg', '4.2deg', '0deg', '-4.2deg', '-6deg', '-4.2deg', '0deg'],
    extrapolate: 'clamp',
  }), [clock])

  return (
    <View style={styles.lockup} accessible accessibilityLabel="CGP, Cockroach Game Party">
      <View style={styles.wordmark}>
        <HomeEmblem name="crown" size={wordmarkSize * .73} />
        <Text style={[styles.title, { fontSize: wordmarkSize, lineHeight: wordmarkSize * 1.03 }]}>CGP</Text>
        <Text numberOfLines={1} style={[styles.subtitle, { fontSize: Math.min(12, wordmarkSize * .26) }]}>COCKROACH GAME PARTY</Text>
      </View>
      <Animated.Image accessible={false} source={require('../../assets/home-art/board.png')} resizeMode="contain" fadeDuration={0}
        style={{ width: size, height: size * .84, transform: [{ rotate: rotation ?? '0deg' }] }} />
    </View>
  )
}

const styles = StyleSheet.create({
  emblem: { alignItems: 'center', justifyContent: 'center' },
  emblemGlow: { position: 'absolute', backgroundColor: 'rgba(169,231,255,0.30)' },
  shine: { position: 'absolute', top: 0, bottom: 0, width: 28, backgroundColor: 'rgba(255,255,255,0.30)' },
  lockup: { alignItems: 'center', justifyContent: 'center' },
  wordmark: { alignItems: 'center', marginBottom: -9, zIndex: 1 },
  title: { fontFamily: DISPLAY, color: A.gold, includeFontPadding: false, textShadowColor: '#092354', textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 3 },
  subtitle: { fontFamily: DISPLAY, color: A.text, letterSpacing: .35, includeFontPadding: false, textShadowColor: '#092354', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
})
