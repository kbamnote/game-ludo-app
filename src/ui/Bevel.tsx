import { useState, type ReactNode } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native'
import Icon from './Icon'
import { C, F, R, T } from '../theme'

/**
 * The design system's extruded toy-plastic control: a solid bottom ledge that
 * collapses as the button presses down, plus a specular crescent on the rim.
 * React Native has no box-shadow offset, so the ledge is a real view behind
 * the face and the press shifts the face down onto it.
 */
export interface BevelProps {
  label: string
  onPress?: () => void
  /** Face colour. */
  color?: string
  /** Ledge colour — the darker underside. */
  ledge?: string
  textColor?: string
  icon?: string
  iconRight?: boolean
  disabled?: boolean
  height?: number
  depth?: number
  radius?: number
  style?: ViewStyle
  children?: ReactNode
}

export default function Bevel({
  label,
  onPress,
  color = C.primaryContainer,
  ledge = C.sapphireDeep,
  textColor = C.onPrimaryContainer,
  icon,
  iconRight = true,
  disabled,
  height = 48,
  depth = 5,
  radius = R.full,
  style,
  children,
}: BevelProps) {
  const [pressed, setPressed] = useState(false)
  const drop = pressed ? depth - 1 : 0

  // Every child is absolutely positioned, so this view has no intrinsic width.
  // Under a parent that centres its cross axis (`alignItems: 'center'`) that
  // collapses it to 0px — invisible and untappable — so it stretches by
  // default. An explicit width in `style` still wins, since align-self only
  // applies when the cross size is auto.
  return (
    <View style={[{ height: height + depth, alignSelf: 'stretch' }, style]}>
      {/* Ledge */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: depth,
          height,
          borderRadius: radius,
          backgroundColor: disabled ? '#2a2f3d' : ledge,
        }}
      />
      <Pressable
        onPress={disabled ? undefined : onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: drop,
          height,
          borderRadius: radius,
          backgroundColor: disabled ? '#39404f' : color,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
          overflow: 'hidden',
        }}
      >
        {/* Specular crescent along the top rim. It has to fade out: a flat
            translucent fill reads as a hard bar rather than a gloss. */}
        <LinearGradient
          colors={['rgba(255,255,255,0.32)', 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0)']}
          locations={[0, 0.6, 1]}
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 2,
            left: '10%',
            right: '10%',
            height: height * 0.38,
            borderRadius: radius,
            opacity: pressed ? 0.45 : 1,
          }}
        />
        {icon && !iconRight && <Icon name={icon} size={20} color={disabled ? C.outline : textColor} />}
        {children ?? (
          <Text
            style={[
              styles.label,
              { color: disabled ? C.outline : textColor },
            ]}
          >
            {label}
          </Text>
        )}
        {icon && iconRight && <Icon name={icon} size={20} color={disabled ? C.outline : textColor} />}
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  label: {
    fontFamily: F.head,
    ...T.headlineSm,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
})
