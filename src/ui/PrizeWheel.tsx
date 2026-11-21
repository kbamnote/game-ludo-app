import { Animated, View, useWindowDimensions } from 'react-native'
import Svg, { Circle, Defs, G, LinearGradient, Path, RadialGradient, Stop, Text as WheelText } from 'react-native-svg'
import { WHEEL_PRIZES } from '../game/profile'
import { Coin } from './ArcadeIcons'

const COLORS = ['#1b6da4', '#a73e58', '#187a67', '#694bad', '#b7642e', '#315fa8']
const point = (angle: number, radius: number) => {
  const rad = (angle - 90) * Math.PI / 180
  return [120 + Math.cos(rad) * radius, 120 + Math.sin(rad) * radius]
}

export default function PrizeWheel({ angle }: { angle: Animated.Value }) {
  const size = Math.min(266, useWindowDimensions().width - 72)
  const rotation = angle.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] })
  return <View accessible accessibilityLabel="Six coin prizes on a gold wheel" style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <Animated.View style={{ position: 'absolute', transform: [{ rotate: rotation }] }}>
      <Svg width={size} height={size} viewBox="0 0 240 240">
        <Defs>
          <LinearGradient id="wheel-metal" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0" stopColor="#fff2b7" /><Stop offset=".35" stopColor="#db9b34" />
            <Stop offset=".63" stopColor="#fff0a2" /><Stop offset="1" stopColor="#ae691c" />
          </LinearGradient>
          <RadialGradient id="wheel-finish" cx="50%" cy="44%" r="55%">
            <Stop offset="0" stopColor="#fff0bf" stopOpacity=".26" />
            <Stop offset=".71" stopColor="#fff0bf" stopOpacity="0" />
            <Stop offset="1" stopColor="#06142a" stopOpacity=".36" />
          </RadialGradient>
        </Defs>
        <Circle cx="120" cy="120" r="118" fill="#805014" />
        <Circle cx="120" cy="119" r="115" fill="url(#wheel-metal)" stroke="#ffdc83" />
        {WHEEL_PRIZES.map((prize, i) => {
          const a = i * 60
          const [x1, y1] = point(a - 30, 105)
          const [x2, y2] = point(a + 30, 105)
          return <G key={prize}><Path d={`M120 120L${x1} ${y1}A105 105 0 0 1 ${x2} ${y2}Z`} fill={COLORS[i]} stroke="#ffd98c" strokeWidth="2" />
            <WheelText x="120" y="54" fill="white" fontWeight="bold" fontSize="16" textAnchor="middle" transform={`rotate(${a} 120 120)`}>{prize}</WheelText>
          </G>
        })}
        <Circle cx="120" cy="120" r="103" fill="url(#wheel-finish)" />
        {Array.from({ length: 24 }, (_, i) => { const [cx, cy] = point(i * 15, 110); return <Circle key={i} cx={cx} cy={cy} r="2" fill="#fff4be" /> })}
      </Svg>
    </Animated.View>
    <Coin size={size * 0.23} />
    <View style={{ position: 'absolute', top: -3 }}><Svg width={28} height={31} viewBox="0 0 28 31">
      <Path d="M2 3Q14 -1 26 3L14 28Z" fill="#fff2ab" stroke="#8c4719" strokeWidth="2" />
    </Svg></View>
  </View>
}
