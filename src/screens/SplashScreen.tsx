import { useEffect, useState } from 'react'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import appConfig from '../../app.json'
import Backdrop from '../ui/Backdrop'
import ArcadeArt from '../ui/ArcadeArt'
import { ArtAccent, HomeArtMotion, HomeBrand, LoadingShine } from '../ui/HomeArt'
import { LABEL, NUMERIC } from '../ui/arcade'
import { A } from '../theme'
import { useAccount } from '../net/account'

/** How long the splash holds before handing over to the lobby. */
const LOAD_MS = 2400

export default function SplashScreen() {
  const { height, width } = useWindowDimensions()
  const [progress, setProgress] = useState(0)
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

  const barWidth = Math.min(width - 72, 280)
  const boardSize = Math.min(width - 50, height * .47, 310)

  return (
    <HomeArtMotion style={styles.root}>
      <Backdrop />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <HomeBrand size={boardSize} />
        </View>

        <View style={styles.footer}>
          <View accessibilityRole="progressbar" accessibilityLabel="Loading game"
            aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} style={[styles.track, { width: barWidth }]}>
            <LinearGradient
              colors={[A.goldLite, A.gold, A.goldMid]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.fill, { width: `${progress}%` }]}
            >
              <LoadingShine width={barWidth} />
            </LinearGradient>
          </View>

          <View style={styles.loadingRow}>
            <ArtAccent group={2}><ArcadeArt name="lucky7" size={28} /></ArtAccent>
            <Text style={styles.loadingLabel}>{progress === 100 && !ready ? 'Restoring session…' : 'Loading game'}</Text>
            <Text style={styles.pct}>{progress}%</Text>
          </View>

          <Text style={styles.build}>v{appConfig.expo.version}</Text>
        </View>
      </SafeAreaView>
    </HomeArtMotion>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: A.bgMid },
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  footer: { alignItems: 'center', paddingBottom: 30, gap: 10 },
  track: {
    height: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(5,20,56,0.85)',
    borderWidth: 2,
    borderColor: A.goldDeep,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  fill: { height: '100%', borderRadius: 999, overflow: 'hidden' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loadingLabel: { fontFamily: LABEL, fontSize: 15, color: A.text, includeFontPadding: false },
  pct: { fontFamily: NUMERIC, fontSize: 13, color: A.gold, includeFontPadding: false },
  build: { fontFamily: LABEL, fontSize: 10, color: 'rgba(207,224,255,0.55)', includeFontPadding: false },
})
