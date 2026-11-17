import { useId } from 'react'
import { View, type ViewStyle } from 'react-native'
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg'

/**
 * The designs lean on large blurred colour blobs (`blur-3xl`). React Native has
 * no backdrop blur for shapes, so each one is drawn as an SVG radial gradient
 * that fades to transparent — visually equivalent and far cheaper than a blur.
 */
export default function Glow({
  size,
  color,
  opacity = 0.2,
  style,
}: {
  size: number
  color: string
  opacity?: number
  style?: ViewStyle
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')

  return (
    <View pointerEvents="none" style={[{ position: 'absolute', width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={color} stopOpacity={opacity} />
            <Stop offset="55%" stopColor={color} stopOpacity={opacity * 0.45} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
      </Svg>
    </View>
  )
}
