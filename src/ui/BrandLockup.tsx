import { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, Text, View } from 'react-native'
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg'
import { OutlineText } from './arcade'
import { BoardEmblem, Die, Pawn } from './ArcadeIcons'
import { A } from '../theme'

/**
 * Crown, wordmark, board and pawns — the game's title lockup.
 * `scale` is driven by available height so it fills a splash and sits neatly
 * in the Home hero without either being hard-coded.
 */
export default function BrandLockup({
  scale = 1,
  animated = false,
}: {
  scale?: number
  animated?: boolean
}) {
  const bob = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!animated) return
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [animated, bob])

  const lift = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -7] })
  const pawn = Math.round(36 * scale)

  return (
    <View style={styles.wrap}>
      {/* Warm glow behind the mark */}
      <View style={[styles.glow, { width: 300 * scale, height: 300 * scale }]} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id="brandGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#7ec2ff" stopOpacity="0.38" />
              <Stop offset="0.55" stopColor="#3d84e6" stopOpacity="0.16" />
              <Stop offset="1" stopColor="#3d84e6" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="50%" cy="50%" r="50%" fill="url(#brandGlow)" />
        </Svg>
      </View>

      <View style={{ marginBottom: -10 * scale, zIndex: 2 }}>
        <Text style={{ fontSize: Math.round(30 * scale) }}>👑</Text>
      </View>

      <OutlineText size={Math.round(48 * scale)} width={4.2 * scale} color={A.gold} outline={A.textOutline}>
        LUDO
      </OutlineText>

      <View style={{ marginTop: -7 * scale }}>
        <OutlineText size={Math.round(21 * scale)} width={2.6} color={A.text} outline={A.textOutline}>
          AFTER DARK
        </OutlineText>
      </View>

      <Animated.View style={[styles.boardRow, animated && { transform: [{ translateY: lift }] }]}>
        <View style={{ marginRight: -10 * scale, marginBottom: 4, zIndex: 3 }}>
          <Pawn size={pawn} color="#3fd0ff" dark="#0a7fd4" />
        </View>

        <View style={{ zIndex: 2 }}>
          <BoardEmblem size={Math.round(122 * scale)} />
          {/* The die rests front-and-centre on the board rather than crowding
              the pawn at the right edge. */}
          <View style={[styles.die, { bottom: -12 * scale }]}>
            <Die size={Math.round(42 * scale)} pips={5} rotate={-12} />
          </View>
        </View>

        <View style={{ marginLeft: -10 * scale, marginBottom: 4, zIndex: 3 }}>
          <Pawn size={pawn} color="#ffc62e" dark="#c67100" />
        </View>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute' },
  boardRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 6 },
  die: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 4 },
})
