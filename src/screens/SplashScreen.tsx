import { useEffect, useState } from 'react'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Animated, Easing, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Backdrop from '../ui/Backdrop'
import BrandLockup from '../ui/BrandLockup'
import { LABEL, NUMERIC, OutlineText } from '../ui/arcade'
import { A } from '../theme'
import { useAccount } from '../net/account'

/** How long the splash holds before handing over to the lobby. */
const LOAD_MS = 2400

export default function SplashScreen() {
  const { height, width } = useWindowDimensions()
  const [progress, setProgress] = useState(0)
  const [shine] = useState(() => new Animated.Value(0))
  const ready = useAccount(s => s.ready)
  const avatar = useAccount(s => s.session?.account.avatar)

  // Fill the bar, then move on by itself — no tap required.
  useEffect(() => {
    const started = Date.now()
    const id = setInterval(() => {
      const pct = Math.min(100, Math.round(((Date.now() - started) / LOAD_MS) * 100))
      setProgress(pct)
      if (pct >= 100) clearInterval(id)
    }, 40)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (ready && progress === 100) router.replace(avatar == null ? '/onboarding' : '/home')
  }, [avatar, progress, ready])

  // Travelling highlight along the loading bar.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shine, { toValue: 1, duration: 1100, easing: Easing.linear, useNativeDriver: true }),
    )
    loop.start()
    return () => loop.stop()
  }, [shine])

  const barWidth = Math.min(width - 72, 280)
  const shineX = shine.interpolate({ inputRange: [0, 1], outputRange: [-60, barWidth + 60] })
  const scale = Math.min(1.25, Math.max(0.78, height / 780))

  return (
    <View style={styles.root}>
      <Backdrop />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <BrandLockup scale={scale} animated />
        </View>

        <View style={styles.footer}>
          <View style={[styles.track, { width: barWidth }]}>
            <LinearGradient
              colors={[A.goldLite, A.gold, A.goldMid]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.fill, { width: `${progress}%` }]}
            />
            <Animated.View style={[styles.shine, { transform: [{ translateX: shineX }, { skewX: '-20deg' }] }]} />
          </View>

          <View style={styles.loadingRow}>
            <OutlineText size={12} width={1.8} color={A.text} outline={A.textOutline} font={LABEL}>
              LOADING
            </OutlineText>
            <Text style={styles.pct}>{progress}%</Text>
          </View>

          <Text style={styles.build}>v1.0.4</Text>
        </View>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: A.bgMid },
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  footer: { alignItems: 'center', paddingBottom: 26, gap: 8 },
  track: {
    height: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(5,20,56,0.85)',
    borderWidth: 2,
    borderColor: A.goldDeep,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  fill: { height: '100%', borderRadius: 999 },
  shine: {
    position: 'absolute',
    width: 34,
    height: '200%',
    backgroundColor: 'rgba(255,255,255,0.33)',
  },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pct: { fontFamily: NUMERIC, fontSize: 13, color: A.gold, includeFontPadding: false },
  build: { fontFamily: LABEL, fontSize: 10, color: 'rgba(207,224,255,0.55)', includeFontPadding: false },
})
