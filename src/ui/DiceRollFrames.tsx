import { useEffect, useState } from 'react'
import { Animated, Easing, Image, Platform, StyleSheet, View } from 'react-native'
import { Asset } from 'expo-asset'
import { matchTime, type DiceRoll } from '../game/store'
import type { Seat } from '../game/rules'

const FRAMES = [
  [
    require('../../assets/dice-rolls/0-1.png'),
    require('../../assets/dice-rolls/0-2.png'),
    require('../../assets/dice-rolls/0-3.png'),
    require('../../assets/dice-rolls/0-4.png'),
    require('../../assets/dice-rolls/0-5.png'),
    require('../../assets/dice-rolls/0-6.png'),
  ],
  [
    require('../../assets/dice-rolls/1-1.png'),
    require('../../assets/dice-rolls/1-2.png'),
    require('../../assets/dice-rolls/1-3.png'),
    require('../../assets/dice-rolls/1-4.png'),
    require('../../assets/dice-rolls/1-5.png'),
    require('../../assets/dice-rolls/1-6.png'),
  ],
  [
    require('../../assets/dice-rolls/2-1.png'),
    require('../../assets/dice-rolls/2-2.png'),
    require('../../assets/dice-rolls/2-3.png'),
    require('../../assets/dice-rolls/2-4.png'),
    require('../../assets/dice-rolls/2-5.png'),
    require('../../assets/dice-rolls/2-6.png'),
  ],
  [
    require('../../assets/dice-rolls/3-1.png'),
    require('../../assets/dice-rolls/3-2.png'),
    require('../../assets/dice-rolls/3-3.png'),
    require('../../assets/dice-rolls/3-4.png'),
    require('../../assets/dice-rolls/3-5.png'),
    require('../../assets/dice-rolls/3-6.png'),
  ],
] as const
const COLUMNS = 8
const ROWS = 8
const FRAME_WIDTH = 80
const FRAME_HEIGHT = 96
const LAST_FRAME = COLUMNS * ROWS - 1
const INPUT_STOPS = [0]
const X_OFFSETS = [0]
const Y_OFFSETS = [0]

// Hold each atlas cell until the next frame boundary. Interpolate the tiny
// interval between cells so the native driver never divides by a zero range.
for (let frame = 1; frame <= LAST_FRAME; frame++) {
  const boundary = (frame - .5) / LAST_FRAME
  INPUT_STOPS.push(boundary - .000001, boundary)
  X_OFFSETS.push(-((frame - 1) % COLUMNS) * FRAME_WIDTH, -(frame % COLUMNS) * FRAME_WIDTH)
  Y_OFFSETS.push(-Math.floor((frame - 1) / COLUMNS) * FRAME_HEIGHT, -Math.floor(frame / COLUMNS) * FRAME_HEIGHT)
}
INPUT_STOPS.push(1)
X_OFFSETS.push(X_OFFSETS[X_OFFSETS.length - 1])
Y_OFFSETS.push(Y_OFFSETS[Y_OFFSETS.length - 1])

export function warmDiceFrames(seat: Seat) {
  for (const source of FRAMES[seat]) {
    const { uri } = Asset.fromModule(source)
    if (/^https?:/.test(uri)) void Image.prefetch(uri).catch(() => {})
  }
}

export function diceRollProgress(roll: DiceRoll) {
  return Math.max(0, Math.min(1, (matchTime() - roll.startedAt) / roll.duration))
}

export default function DiceRollFrames({ roll, paused, onFinish, onReady }: {
  roll: DiceRoll
  paused: boolean
  onFinish: (roll: DiceRoll) => void
  onReady: () => void
}) {
  const [progress] = useState(() => new Animated.Value(diceRollProgress(roll)))
  const [translateX] = useState(() => progress.interpolate({
    inputRange: INPUT_STOPS, outputRange: X_OFFSETS, extrapolate: 'clamp',
  }))
  const [translateY] = useState(() => progress.interpolate({
    inputRange: INPUT_STOPS, outputRange: Y_OFFSETS, extrapolate: 'clamp',
  }))

  useEffect(() => {
    const elapsed = diceRollProgress(roll)
    progress.setValue(elapsed)
    if (paused) return
    const motion = Animated.timing(progress, {
      toValue: 1,
      duration: Math.round(roll.duration * (1 - elapsed)),
      easing: Easing.linear,
      isInteraction: false,
      useNativeDriver: Platform.OS !== 'web',
    })
    motion.start(({ finished }) => { if (finished) onFinish(roll) })
    return () => motion.stop()
  }, [onFinish, paused, progress, roll])

  return <View pointerEvents="none" style={styles.viewport}>
    <Animated.View style={{ transform: [{ translateX }, { translateY }] }}>
      <Image source={FRAMES[roll.seat][roll.die - 1]} fadeDuration={0} resizeMode="stretch"
        onLoad={onReady} style={styles.atlas} />
    </Animated.View>
  </View>
}

const styles = StyleSheet.create({
  // The atlas crops the SVG canvas from (16, 24), so its dock stays aligned.
  viewport: { position: 'absolute', left: 16, top: 24, width: FRAME_WIDTH, height: FRAME_HEIGHT, overflow: 'hidden' },
  atlas: { width: COLUMNS * FRAME_WIDTH, height: ROWS * FRAME_HEIGHT },
})
