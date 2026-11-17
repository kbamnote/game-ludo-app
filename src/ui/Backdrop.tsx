import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet, View } from 'react-native'
import Svg, { Circle, Defs, Pattern, Rect, Stop, RadialGradient as SvgRadial } from 'react-native-svg'
import { A } from '../theme'

/** The lobby's deep-blue board-print backdrop, shared by Splash and Home. */
export default function Backdrop() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={[A.bgLite, A.bgMid, A.bgDeep]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern id="bdDots" width="46" height="46" patternUnits="userSpaceOnUse">
            <Circle cx="10" cy="10" r="3.2" fill={A.pattern} />
            <Rect x="26" y="26" width="12" height="12" rx="3" fill={A.pattern} />
          </Pattern>
          <SvgRadial id="bdVig" cx="50%" cy="38%" r="75%">
            <Stop offset="0" stopColor="#000000" stopOpacity="0" />
            <Stop offset="1" stopColor="#000814" stopOpacity="0.55" />
          </SvgRadial>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#bdDots)" />
        <Rect width="100%" height="100%" fill="url(#bdVig)" />
      </Svg>
    </View>
  )
}
